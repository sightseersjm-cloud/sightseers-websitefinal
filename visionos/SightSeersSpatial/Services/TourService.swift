//
//  TourService.swift
//  SightSeersSpatial
//
//  Fetches the tour catalog from the live Sight Seers API and shares it,
//  plus the user's trip board, across the app.
//

import Foundation
import Observation

@Observable
@MainActor
final class TourStore {
    static let apiBase = URL(string: "https://www.sightseerscaribbean.com/api")!

    private(set) var tours: [Tour] = []
    private(set) var isLoading = false
    private(set) var lastError: String?

    /// Trip board — slugs the user has added, in order. Persisted locally.
    var tripSlugs: [String] {
        didSet { UserDefaults.standard.set(tripSlugs, forKey: "tripSlugs") }
    }

    init() {
        tripSlugs = UserDefaults.standard.stringArray(forKey: "tripSlugs") ?? []
    }

    var tripTours: [Tour] {
        tripSlugs.compactMap { slug in tours.first { $0.slug == slug } }
    }

    var tripTotalFromUSD: Int {
        tripTours.reduce(0) { $0 + $1.pricing.from }
    }

    func loadTours() async {
        guard !isLoading else { return }
        isLoading = true
        lastError = nil
        defer { isLoading = false }
        do {
            let url = Self.apiBase.appending(path: "vtours")
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoded = try JSONDecoder().decode(ToursResponse.self, from: data)
            tours = decoded.tours
        } catch {
            lastError = error.localizedDescription
        }
    }

    func addToTrip(_ tour: Tour) {
        guard !tripSlugs.contains(tour.slug) else { return }
        tripSlugs.append(tour.slug)
    }

    func removeFromTrip(_ tour: Tour) {
        tripSlugs.removeAll { $0 == tour.slug }
    }

    func tour(slug: String) -> Tour? {
        tours.first { $0.slug == slug }
    }
}
