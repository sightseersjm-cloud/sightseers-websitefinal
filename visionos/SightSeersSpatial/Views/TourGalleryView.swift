//
//  TourGalleryView.swift
//  SightSeersSpatial
//
//  The floating portal grid: every tour as a glass card. Tours with a
//  spatial scene open the ImmersiveSpace; others deep-link to the live
//  web portal until their panoramas are captured.
//

import SwiftUI

struct TourGalleryView: View {
    @Environment(TourStore.self) private var store
    @Environment(AppModel.self) private var appModel
    @Environment(\.openWindow) private var openWindow
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.openURL) private var openURL

    private let columns = [GridItem(.adaptive(minimum: 300), spacing: 24)]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 24) {
                    ForEach(store.tours) { tour in
                        TourPortalCard(tour: tour) {
                            open(tour)
                        }
                    }
                }
                .padding(28)
            }
            .navigationTitle("Sight Seers Spatial Tour Portals")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        openWindow(id: "tripboard")
                    } label: {
                        Label("Trip Board (\(store.tripSlugs.count))", systemImage: "list.clipboard")
                    }
                }
            }
            .overlay {
                if store.isLoading && store.tours.isEmpty {
                    ProgressView("Loading Caribbean tours…")
                } else if let err = store.lastError, store.tours.isEmpty {
                    ContentUnavailableView("Couldn't reach Sight Seers",
                                           systemImage: "wifi.exclamationmark",
                                           description: Text(err))
                }
            }
        }
        .glassBackgroundEffect()
    }

    private func open(_ tour: Tour) {
        appModel.selectedTour = tour
        if tour.spatial != nil {
            Task {
                if !appModel.immersiveSpaceActive {
                    let result = await openImmersiveSpace(id: "tour-immersive")
                    appModel.immersiveSpaceActive = (result == .opened)
                }
            }
        } else {
            // No captured panorama yet — hand off to the live guided portal.
            openURL(tour.links.livePortal)
        }
    }
}

struct TourPortalCard: View {
    let tour: Tour
    let action: () -> Void
    @Environment(TourStore.self) private var store

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 0) {
                AsyncImage(url: tour.media.hero) { image in
                    image.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle().fill(.quaternary)
                }
                .frame(height: 170)
                .clipped()
                .overlay(alignment: .topLeading) {
                    if tour.spatial != nil {
                        Text("INTERACTIVE 360°")
                            .font(.caption2.bold())
                            .padding(.horizontal, 10).padding(.vertical, 5)
                            .background(.orange, in: .capsule)
                            .foregroundStyle(.white)
                            .padding(10)
                    }
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(tour.title).font(.title3.bold())
                    Text("\(tour.location) · \(tour.duration)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(tour.shortDescription)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                    HStack {
                        Text("from $\(tour.pricing.from)")
                            .font(.headline)
                        Spacer()
                        Button {
                            store.addToTrip(tour)
                        } label: {
                            Label("Add to Trip", systemImage: "plus.circle.fill")
                                .font(.caption.bold())
                        }
                        .buttonStyle(.borderless)
                    }
                    .padding(.top, 6)
                }
                .padding(16)
            }
        }
        .buttonStyle(.plain)
        .background(.regularMaterial, in: .rect(cornerRadius: 24))
        .hoverEffect()
        .accessibilityLabel("\(tour.title), \(tour.location), from \(tour.pricing.from) dollars")
    }
}
