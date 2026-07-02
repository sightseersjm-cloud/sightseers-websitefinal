//
//  SpatialPhotoView.swift
//  SightSeersSpatial
//
//  visionOS 26 "spatial scenes": ImagePresentationComponent turns an
//  ordinary 2D tour photo into a depth-parallax 3D scene automatically —
//  the entire existing Sight Seers photo library becomes lightly-3D
//  content with no capture work.
//
//  Used from TourDetailView for tours that have hero photos but no
//  panorama yet (spatial == nil).
//

import SwiftUI
import RealityKit

struct SpatialPhotoView: View {
    let imageURL: URL
    @State private var loadFailed = false

    var body: some View {
        Group {
            if loadFailed {
                AsyncImage(url: imageURL) { image in
                    image.resizable().aspectRatio(contentMode: .fit)
                } placeholder: { ProgressView() }
            } else {
                RealityView { content in
                    do {
                        let (data, _) = try await URLSession.shared.data(from: imageURL)
                        // visionOS 26: generate a spatial scene from a 2D image.
                        let image = try await ImagePresentationComponent.Image(data: data)
                        var component = ImagePresentationComponent(image: image)
                        // Prefer the generated spatial scene; falls back to 2D
                        // automatically on failure or older OS versions.
                        if component.availableViewingModes.contains(.spatialStereoImmersive) {
                            component.desiredViewingMode = .spatialStereo
                        }
                        let entity = Entity()
                        entity.components.set(component)
                        content.add(entity)
                    } catch {
                        loadFailed = true
                    }
                }
            }
        }
        .frame(minHeight: 260)
        .accessibilityLabel("Tour photo shown as a spatial 3D scene")
    }
}
