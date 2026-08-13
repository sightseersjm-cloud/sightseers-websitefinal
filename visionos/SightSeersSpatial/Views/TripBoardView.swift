//
//  TripBoardView.swift
//  SightSeersSpatial
//
//  The spatial itinerary board: everything the user has added, a running
//  from-price total, and the quote handoff. Opens as its own window so it
//  can sit beside the gallery or the immersive scene.
//

import SwiftUI

struct TripBoardView: View {
    @Environment(TourStore.self) private var store
    @Environment(\.openURL) private var openURL

    var body: some View {
        NavigationStack {
            Group {
                if store.tripTours.isEmpty {
                    ContentUnavailableView(
                        "Your trip board is empty",
                        systemImage: "list.clipboard",
                        description: Text("Add tours from the gallery or from inside a 360° scene.")
                    )
                } else {
                    List {
                        ForEach(store.tripTours) { tour in
                            HStack(spacing: 12) {
                                AsyncImage(url: tour.media.hero) { image in
                                    image.resizable().aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Rectangle().fill(.quaternary)
                                }
                                .frame(width: 68, height: 48)
                                .clipShape(.rect(cornerRadius: 8))

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(tour.title).font(.headline)
                                    Text("\(tour.location) · \(tour.duration)")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text("$\(tour.pricing.from)").font(.subheadline.bold())
                            }
                            .swipeActions {
                                Button(role: .destructive) {
                                    store.removeFromTrip(tour)
                                } label: {
                                    Label("Remove", systemImage: "trash")
                                }
                            }
                        }

                        Section {
                            HStack {
                                Text("Estimated from-total").font(.headline)
                                Spacer()
                                Text("USD $\(store.tripTotalFromUSD)")
                                    .font(.title3.bold())
                            }
                            Button {
                                openURL(URL(string: "https://www.sightseerscaribbean.com/#booking")!)
                            } label: {
                                Label("Request Group Quote", systemImage: "paperplane.fill")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.orange)
                        }
                    }
                }
            }
            .navigationTitle("Trip Board")
        }
    }
}
