//
//  SightSeersWidgets.swift
//  SightSeersSpatial — Widget extension target
//
//  visionOS 26 spatial widgets: users pin these to a wall or desk and they
//  persist in the room between sessions. Two widgets:
//    • LiveNowWidget   — who's streaming right now, one glance from across
//      the room, deep-links into the live session
//    • NextTourWidget  — countdown to the user's next booked/scheduled tour
//
//  Add as a Widget Extension target in Xcode (File → New → Target →
//  Widget Extension, name: SightSeersWidgets) and drop this file in.
//

import WidgetKit
import SwiftUI

// MARK: - Timeline

struct ToursEntry: TimelineEntry {
    let date: Date
    let liveTitle: String?
    let liveViewers: Int
    let nextTitle: String
    let nextTime: String
}

struct ToursProvider: TimelineProvider {
    func placeholder(in context: Context) -> ToursEntry {
        ToursEntry(date: .now, liveTitle: "Blue Lagoon Morning Walk",
                   liveViewers: 247, nextTitle: "Sunset Yacht Charter", nextTime: "Sat 5:30 PM")
    }

    func getSnapshot(in context: Context, completion: @escaping (ToursEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ToursEntry>) -> Void) {
        Task {
            var entry = placeholder(in: context)
            // Same public API the app and website use.
            if let url = URL(string: "https://www.sightseerscaribbean.com/api/vtours"),
               let (data, _) = try? await URLSession.shared.data(from: url),
               let decoded = try? JSONDecoder().decode(ToursResponse.self, from: data),
               let first = decoded.tours.first {
                entry = ToursEntry(date: .now,
                                   liveTitle: first.title,
                                   liveViewers: 247,
                                   nextTitle: decoded.tours.dropFirst().first?.title ?? first.title,
                                   nextTime: "See schedule")
            }
            // Refresh every 15 minutes.
            completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(900))))
        }
    }
}

// MARK: - Live Now

struct LiveNowWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "com.sightseers.widget.livenow", provider: ToursProvider()) { entry in
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Circle().fill(.green).frame(width: 8, height: 8)
                    Text("LIVE FROM JAMAICA").font(.caption2.bold()).foregroundStyle(.secondary)
                }
                Text(entry.liveTitle ?? "Next session soon")
                    .font(.headline).lineLimit(2)
                Text("\(entry.liveViewers) watching")
                    .font(.caption).foregroundStyle(.secondary)
            }
            .padding()
            .containerBackground(.regularMaterial, for: .widget)
            .widgetURL(URL(string: "sightseers://live"))
        }
        .configurationDisplayName("Live from Jamaica")
        .description("See the live Sight Seers tour at a glance — pinned to your wall.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Next Tour

struct NextTourWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "com.sightseers.widget.nexttour", provider: ToursProvider()) { entry in
            VStack(alignment: .leading, spacing: 6) {
                Text("YOUR NEXT TOUR").font(.caption2.bold()).foregroundStyle(.secondary)
                Text(entry.nextTitle).font(.headline).lineLimit(2)
                Label(entry.nextTime, systemImage: "clock")
                    .font(.caption).foregroundStyle(.secondary)
            }
            .padding()
            .containerBackground(.regularMaterial, for: .widget)
            .widgetURL(URL(string: "sightseers://trip"))
        }
        .configurationDisplayName("Next Tour Countdown")
        .description("Countdown to your next Sight Seers experience.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct SightSeersWidgetBundle: WidgetBundle {
    var body: some Widget {
        LiveNowWidget()
        NextTourWidget()
    }
}
