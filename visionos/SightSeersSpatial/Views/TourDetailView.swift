//
//  TourDetailView.swift
//  SightSeersSpatial
//
//  The floating glass detail panel shown as a leading ornament inside the
//  immersive scene — the visionOS translation of the website's slide-in
//  detail card.
//

import SwiftUI

struct TourDetailView: View {
    let tour: Tour
    @Environment(TourStore.self) private var store
    @Environment(\.openURL) private var openURL

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(tour.title).font(.title.bold())
                    Text(tour.location).foregroundStyle(.secondary)
                }

                HStack(spacing: 8) {
                    chip(tour.duration, "clock")
                    chip(tour.groupSize, "person.3")
                    chip("from $\(tour.pricing.from)", "tag")
                }

                Text(tour.shortDescription)
                    .font(.callout)

                VStack(alignment: .leading, spacing: 6) {
                    Text("What's included").font(.headline)
                    ForEach(tour.included, id: \.self) { item in
                        Label(item, systemImage: "checkmark.circle.fill")
                            .font(.callout)
                            .foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Tour stops").font(.headline)
                    ForEach(Array(tour.itinerary.enumerated()), id: \.offset) { i, stop in
                        HStack(alignment: .top, spacing: 10) {
                            Text("\(i + 1)")
                                .font(.caption.bold())
                                .frame(width: 22, height: 22)
                                .background(.blue.opacity(0.25), in: .circle)
                            Text(stop).font(.callout).foregroundStyle(.secondary)
                        }
                    }
                }

                VStack(spacing: 10) {
                    Button {
                        store.addToTrip(tour)
                    } label: {
                        Label(store.tripSlugs.contains(tour.slug) ? "On Your Trip Board" : "Add to Itinerary",
                              systemImage: store.tripSlugs.contains(tour.slug) ? "checkmark" : "plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)

                    Button {
                        openURL(tour.links.book)
                    } label: {
                        Text("Request Quote").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
                .padding(.top, 4)
            }
            .padding(22)
        }
        .frame(maxHeight: 640)
    }

    private func chip(_ text: String, _ symbol: String) -> some View {
        Label(text, systemImage: symbol)
            .font(.caption)
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(.thinMaterial, in: .capsule)
    }
}
