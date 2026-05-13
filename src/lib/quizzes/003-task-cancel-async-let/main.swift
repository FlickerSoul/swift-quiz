let task = Task {
    async let a = { () async in
        defer { print("after waiting a") }
        await withCheckedContinuation { cont in
            Task {
                try await Task.sleep(for: .seconds(2))
                cont.resume(returning: ())
            }
        }
    }()

    async let b = { () async throws in
        defer { print("after waiting b") }
        try await Task.sleep(for: .seconds(5))
    }()

    print("end of task")
}

await task.result
