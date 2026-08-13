//
//  Tour.swift
//  SightSeersSpatial
//
//  Codable models matching GET https://www.sightseerscaribbean.com/api/vtours
//  (contract documented in visionos/SPEC.md §3).
//

import Foundation

struct ToursResponse: Codable {
    let ok: Bool
    let version: String
    let count: Int
    let tours: [Tour]
}

struct SingleTourResponse: Codable {
    let ok: Bool
    let version: String
    let tour: Tour
}

struct Tour: Codable, Identifiable, Hashable {
    let id: String
    let slug: String
    let title: String
    let location: String
    let category: String
    let intents: [String]
    let duration: String
    let groupSize: String
    let pricing: Pricing
    let shortDescription: String
    let overview: [String]
    let included: [String]
    let itinerary: [String]
    let faq: [FAQItem]
    let related: [String]
    let media: Media
    let spatial: SpatialScene?
    let links: Links

    struct Pricing: Codable, Hashable {
        let from: Int
        let currency: String
    }

    struct FAQItem: Codable, Hashable {
        let question: String
        let answer: String
    }

    struct Media: Codable, Hashable {
        let hero: URL?
        let og: URL?
        let panorama: URL?
    }

    struct Links: Codable, Hashable {
        let page: URL
        let book: URL
        let livePortal: URL
    }
}

struct SpatialScene: Codable, Hashable {
    let type: String                 // "equirectangular"
    let panorama: URL
    let initialView: InitialView
    let ambientAudioLabel: String?
    let hotspots: [Hotspot]

    struct InitialView: Codable, Hashable {
        let yaw: Double
        let pitch: Double
        let hfov: Double
    }
}

struct Hotspot: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let type: HotspotType
    let pitch: Double                // degrees, + is up
    let yaw: Double                  // degrees, + is right of initial center
    let priceUSD: Int?
    let cta: String

    enum HotspotType: String, Codable {
        case identify, auction, product
    }
}
