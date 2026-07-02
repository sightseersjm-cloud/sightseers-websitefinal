//
//  TourIntents.swift
//  SightSeersSpatial
//
//  App Intents — the voice layer (spec §4):
//    "Add this to my trip"    → AddTourToTripIntent
//    "Show me yacht tours"    → OpenTourCategoryIntent
//  Siri, Shortcuts, and Spotlight all resolve through these.
//

import AppIntents
import Foundation

struct AddTourToTripIntent: AppIntent {
    static let title: LocalizedStringResource = "Add Tour to My Trip"
    static let description = IntentDescription("Adds a Sight Seers Caribbean tour to your trip board.")

    @Parameter(title: "Tour name")
    var tourName: String

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let store = TourStore()
        await store.loadTours()
        guard let tour = store.tours.first(where: {
            $0.title.localizedCaseInsensitiveContains(tourName)
        }) else {
            return .result(dialog: "I couldn't find a tour called \(tourName).")
        }
        store.addToTrip(tour)
        return .result(dialog: "\(tour.title) is on your trip board — from $\(tour.pricing.from) per person.")
    }
}

struct OpenTourCategoryIntent: AppIntent {
    static let title: LocalizedStringResource = "Show Tours by Category"
    static let description = IntentDescription("Opens the Sight Seers gallery filtered to a category, like yacht charters or beaches.")
    static let openAppWhenRun = true

    @Parameter(title: "Category")
    var category: String

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // M2: route the category into TourGalleryView's filter state.
        return .result(dialog: "Showing \(category) tours.")
    }
}

struct SightSeersShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddTourToTripIntent(),
            phrases: [
                "Add this tour to my trip in \(.applicationName)",
                "Add \(\.$tourName) to my \(.applicationName) trip"
            ],
            shortTitle: "Add to Trip",
            systemImageName: "plus.circle"
        )
        AppShortcut(
            intent: OpenTourCategoryIntent(),
            phrases: [
                "Show me \(\.$category) tours in \(.applicationName)"
            ],
            shortTitle: "Browse Tours",
            systemImageName: "safari"
        )
    }
}
