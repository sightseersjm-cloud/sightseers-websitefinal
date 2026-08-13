//
//  ImmersivePanoramaView.swift
//  SightSeersSpatial
//
//  The heart of the app: an inward-facing textured sphere places the user
//  inside the tour's real 360° photograph. Hotspots from the API are
//  anchored at their (pitch, yaw) positions; gaze highlights them and a
//  pinch opens the hotspot card. Ornaments carry the tour detail panel
//  (leading) and the action dock (bottom) — the visionOS translation of
//  the website's glass panel + floating dock.
//

import SwiftUI
import RealityKit

struct ImmersivePanoramaView: View {
    @Environment(TourStore.self) private var store
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace

    @State private var tappedHotspot: Hotspot?

    private let sphereRadius: Float = 10
    private let hotspotRadius: Float = 9.3

    var body: some View {
        RealityView { content in
            guard let tour = appModel.selectedTour,
                  let scene = tour.spatial else { return }

            // ── Panorama sphere ────────────────────────────────────────
            if let panoEntity = await makePanoramaSphere(url: scene.panorama) {
                // Rotate so the scene's initial view direction faces the user (-Z).
                let yaw = Float(scene.initialView.yaw) * .pi / 180
                panoEntity.orientation = simd_quatf(angle: yaw, axis: [0, 1, 0])
                content.add(panoEntity)
            }

            // ── Hotspots ───────────────────────────────────────────────
            for hotspot in scene.hotspots {
                let entity = makeHotspotEntity(hotspot)
                content.add(entity)
            }
        }
        .gesture(
            SpatialTapGesture()
                .targetedToAnyEntity()
                .onEnded { value in
                    if let hs = value.entity.components[HotspotComponent.self] {
                        tappedHotspot = hs.hotspot
                    }
                }
        )
        // Leading ornament: the glass tour-detail panel.
        .ornament(attachmentAnchor: .scene(.leading)) {
            if let tour = appModel.selectedTour {
                TourDetailView(tour: tour)
                    .frame(width: 360)
                    .glassBackgroundEffect()
            }
        }
        // Bottom ornament: Explore · Ask · Add · Invite · Quote · Save dock.
        .ornament(attachmentAnchor: .scene(.bottom)) {
            ActionDock()
                .glassBackgroundEffect()
        }
        .sheet(item: $tappedHotspot) { hotspot in
            HotspotCard(hotspot: hotspot)
                .presentationDetents([.height(280)])
        }
        .onDisappear { appModel.immersiveSpaceActive = false }
    }

    // MARK: sphere

    private func makePanoramaSphere(url: URL) async -> Entity? {
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let cgImage = UIImage(data: data)?.cgImage else { return nil }
            let texture = try await TextureResource(image: cgImage,
                                                    options: .init(semantic: .color))
            var material = UnlitMaterial()
            material.color = .init(texture: .init(texture))

            let sphere = MeshResource.generateSphere(radius: sphereRadius)
            let entity = ModelEntity(mesh: sphere, materials: [material])
            // Invert the sphere so the texture faces inward, toward the viewer.
            entity.scale = [-1, 1, 1]
            return entity
        } catch {
            print("Panorama load failed:", error)
            return nil
        }
    }

    // MARK: hotspots

    private func makeHotspotEntity(_ hotspot: Hotspot) -> Entity {
        let pitch = Float(hotspot.pitch) * .pi / 180
        let yaw = Float(hotspot.yaw) * .pi / 180
        // Web-viewer convention → RealityKit space (see SPEC.md §3).
        let position = SIMD3<Float>(
            cos(pitch) * sin(yaw),
            sin(pitch),
            -cos(pitch) * cos(yaw)
        ) * hotspotRadius

        let dot = ModelEntity(
            mesh: .generateSphere(radius: 0.14),
            materials: [SimpleMaterial(color: .init(red: 0.94, green: 0.53, blue: 0.19, alpha: 0.92),
                                       isMetallic: false)]
        )
        dot.position = position
        dot.components.set(HotspotComponent(hotspot: hotspot))
        dot.components.set(InputTargetComponent())
        dot.components.set(HoverEffectComponent())
        dot.components.set(CollisionComponent(shapes: [.generateSphere(radius: 0.3)]))
        return dot
    }
}

/// Attaches the API hotspot to its RealityKit entity for tap handling.
struct HotspotComponent: Component {
    let hotspot: Hotspot
}

// MARK: - Hotspot card (pinch result)

struct HotspotCard: View {
    let hotspot: Hotspot
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(spacing: 14) {
            Text(hotspot.title).font(.title2.bold())
            if let price = hotspot.priceUSD {
                Text("USD $\(price)").font(.headline).foregroundStyle(.secondary)
            }
            Button(hotspot.cta) {
                // M2 wires this to cart/checkout; today it hands off to the site.
                openURL(URL(string: "https://www.sightseerscaribbean.com/#vtours")!)
                dismiss()
            }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
        }
        .padding(28)
    }
}

// MARK: - Action dock

struct ActionDock: View {
    @Environment(TourStore.self) private var store
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.openURL) private var openURL

    var body: some View {
        HStack(spacing: 22) {
            dockButton("Explore", "safari") {
                Task {
                    await dismissImmersiveSpace()
                    appModel.immersiveSpaceActive = false
                }
            }
            dockButton("Ask", "questionmark.bubble") {
                appModel.showConcierge = true
            }
            dockButton("Add Tour", "plus.circle") {
                if let tour = appModel.selectedTour { store.addToTrip(tour) }
            }
            dockButton("Invite", "person.2.badge.plus") {
                Task { try? await PlanTripTogether().activate() }
            }
            dockButton("Quote", "envelope") {
                if let tour = appModel.selectedTour { openURL(tour.links.book) }
            }
            dockButton("Save", "heart") {
                if let tour = appModel.selectedTour { store.addToTrip(tour) }
            }
        }
        .padding(.horizontal, 26)
        .padding(.vertical, 14)
    }

    private func dockButton(_ title: String, _ symbol: String,
                            action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: symbol).font(.title3)
                Text(title).font(.caption2)
            }
        }
        .buttonStyle(.borderless)
    }
}
