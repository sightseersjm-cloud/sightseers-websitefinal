//
//  GroupPlanningActivity.swift
//  SightSeersSpatial
//
//  SharePlay: friends join a shared planning session from FaceTime — or,
//  on visionOS 26, share the app window with another headset in the same
//  room (nearby window sharing) — and browse portals / build the trip
//  board together. TripSyncMessage keeps every participant's selection,
//  trip board, and votes in lockstep.
//

import Foundation
import GroupActivities

struct PlanTripTogether: GroupActivity {
    static let activityIdentifier = "com.sightseers.spatial.plantrip"

    var metadata: GroupActivityMetadata {
        var meta = GroupActivityMetadata()
        meta.title = "Plan a Caribbean Trip Together"
        meta.subtitle = "Tour Jamaica in 360° and vote on the itinerary"
        meta.type = .generic
        meta.fallbackURL = URL(string: "https://www.sightseerscaribbean.com/virtual-tours/")
        return meta
    }
}

/// Everything participants keep in sync. Mirrors the web portal's
/// DataChannel protocol (docs/WEBRTC-PLAN.md §8) so mixed web + headset
/// groups stay consistent.
struct TripSyncMessage: Codable {
    var selectedTourSlug: String?
    var tripSlugs: [String]
    var votes: [String: String]     // participantID → tour slug
}

@MainActor
final class GroupPlanningCoordinator: ObservableObject {
    static let shared = GroupPlanningCoordinator()

    @Published var isShared = false
    @Published var participantCount = 1
    @Published var votes: [String: String] = [:]

    private var messenger: GroupSessionMessenger?
    private var session: GroupSession<PlanTripTogether>?
    private var tasks = Set<Task<Void, Never>>()

    /// Call once at app launch.
    func configureSessions(store: TourStore, appModel: AppModel) {
        Task {
            for await session in PlanTripTogether.sessions() {
                self.join(session, store: store, appModel: appModel)
            }
        }
    }

    private func join(_ session: GroupSession<PlanTripTogether>,
                      store: TourStore, appModel: AppModel) {
        self.session = session
        let messenger = GroupSessionMessenger(session: session)
        self.messenger = messenger
        isShared = true

        tasks.insert(Task {
            for await (message, _) in messenger.messages(of: TripSyncMessage.self) {
                // Remote state wins; SwiftUI re-renders everything downstream.
                store.tripSlugs = message.tripSlugs
                if let slug = message.selectedTourSlug {
                    appModel.selectedTour = store.tour(slug: slug)
                }
                self.votes = message.votes
            }
        })

        tasks.insert(Task {
            for await state in session.$state.values {
                if case .invalidated = state {
                    self.isShared = false
                    self.messenger = nil
                    self.session = nil
                }
            }
        })

        tasks.insert(Task {
            for await participants in session.$activeParticipants.values {
                self.participantCount = participants.count
            }
        })

        session.join()
    }

    /// Broadcast local changes — call after addToTrip / tour selection / vote.
    func broadcast(store: TourStore, appModel: AppModel) {
        guard let messenger else { return }
        let msg = TripSyncMessage(selectedTourSlug: appModel.selectedTour?.slug,
                                  tripSlugs: store.tripSlugs,
                                  votes: votes)
        Task { try? await messenger.send(msg) }
    }

    func castVote(participant: String, slug: String,
                  store: TourStore, appModel: AppModel) {
        votes[participant] = slug
        broadcast(store: store, appModel: appModel)
    }
}
