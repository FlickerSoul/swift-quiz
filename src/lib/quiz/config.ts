// Site-wide configuration. Client-safe: this module is plain strings with
// no runtime dependencies, so it's fine to import from both server and client.

export const REPO_URL = 'https://github.com/Flickersoul/swift-quiz';

// Swift toolchains to verify quizzes against. Each entry is either:
//   - "major.minor"        → resolved to the highest available patch release
//                            (e.g. "6.3" → "6.3.1") and installed via swiftly
//                            if not already present.
//   - "major.minor.patch"  → exact pin, installed if missing.
//
// The resolved exact version is what shows on the verification badge.
export const SWIFT_VERSIONS = ['6.3'] as const;

export type SwiftVersionSpec = (typeof SWIFT_VERSIONS)[number];
