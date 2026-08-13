//
//  SightSeersSpatialApp.swift
//  SightSeersSpatial
//
//  App entry: a windowed tour gallery + trip board in the Shared Space,
//  and an ImmersiveSpace that places the user inside a tour's 360° scene.
//

import SwiftUI

@main
struct SightSeersSpatialApp: App {
    @State private var store = TourStore()
    @State private var appModel = AppModel()

    var body: some Scene {
        WindowGroup(id: "gallery") {
            TourGalleryView()
                .environment(store)
                .environment(appModel)
                .task {
                    await store.loadTours()
                    GroupPlanningCoordinator.shared.configureSessions(store: store, appModel: appModel)
                }
        }
        .windowStyle(.plain)
        .defaultSize(width: 1100, height: 760)

        WindowGroup(id: "tripboard") {
            TripBoardView()
                .environment(store)
                .environment(appModel)
        }
        .defaultSize(width: 460, height: 640)

        // "Rest at the Lagoon" — panorama as passive surroundings; the
        // Digital Crown dials it in/out around the user's real room.
        ImmersiveSpace(id: "lagoon-environment") {
            LagoonEnvironmentView()
        }
        .immersionStyle(selection: .constant(.progressive), in: .progressive, .full)

        ImmersiveSpace(id: "tour-immersive") {
            ImmersivePanoramaView()
                .environment(store)
                .environment(appModel)
        }
        // Full immersion: the panorama replaces the passthrough entirely,
        // like stepping through a portal. Use .mixed for a windowed portal feel.
        .immersionStyle(selection: .constant(.full), in: .mixed, .full)
    }
}

/// Cross-scene UI state: which tour is open, whether immersion is active.
@Observable
@MainActor
final class AppModel {
    var selectedTour: Tour?
    var immersiveSpaceActive = false
    var showConcierge = false
    var showQuoteForm = false
}
