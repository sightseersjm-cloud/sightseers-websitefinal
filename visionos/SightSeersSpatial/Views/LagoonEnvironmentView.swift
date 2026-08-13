//
//  LagoonEnvironmentView.swift
//  SightSeersSpatial
//
//  "Blue Lagoon" as a resting Environment: the panorama becomes passive
//  surroundings (like Apple's Bora Bora environment) with all UI hidden —
//  the brand stays in the user's headset even when they're not planning.
//
//  Registered as its own ImmersiveSpace with .progressive immersion so the
//  Digital Crown dials the lagoon in and out around the user's real room.
//

import SwiftUI
import RealityKit

struct LagoonEnvironmentView: View {
    private let panoramaURL = URL(string: "https://www.sightseerscaribbean.com/panos/blue-lagoon.jpg")!

    var body: some View {
        RealityView { content in
            guard let (data, _) = try? await URLSession.shared.data(from: panoramaURL),
                  let cgImage = UIImage(data: data)?.cgImage,
                  let texture = try? await TextureResource(image: cgImage, options: .init(semantic: .color))
            else { return }

            var material = UnlitMaterial()
            material.color = .init(texture: .init(texture))
            let sphere = ModelEntity(mesh: .generateSphere(radius: 12), materials: [material])
            sphere.scale = [-1, 1, 1]   // texture faces inward
            content.add(sphere)

            // Gentle ambient: no hotspots, no ornaments — this is a place to be.
        }
        .preferredSurroundingsEffect(.systemDark)
    }
}

/*
 Registration (add to SightSeersSpatialApp.swift):

     ImmersiveSpace(id: "lagoon-environment") {
         LagoonEnvironmentView()
     }
     .immersionStyle(selection: .constant(.progressive), in: .progressive, .full)

 Entry point: a "Rest at the Lagoon" button in the gallery toolbar that
 opens this space instead of the tour viewer.
 */
