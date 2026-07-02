//
//  GroupPlanningActivity.swift
//  SightSeersSpatial
//
//  SharePlay: friends join a shared planning session from FaceTime and
//  browse portals / build the trip board together (spec §4 "Invite").
//  M3 adds state sync (selected tour, trip board, votes) over the
//  GroupSession messenger; this file establishes the activity itself.
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

/// M3 scaffold: observe incoming sessions and keep participants in sync.
@MainActor
final class GroupPlanningCoordinator {
    static let shared = GroupPlanningCoordinator()

    func configureSessions() {
        Task {
            for await session in PlanTripTogether.sessions() {
                session.join()
                // M3: attach a GroupSessionMessenger here and sync
                // { selectedTourSlug, tripSlugs, votes } between participants.
            }
        }
    }
}
