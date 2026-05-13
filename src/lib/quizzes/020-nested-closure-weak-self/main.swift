func longRunningTask(_ body: @escaping () -> Void) async throws {
    while !Task.isCancelled {
        try await Task.sleep(for: .seconds(1))
        body()
    }
}

class Obj {
    var task: Task<Void, any Error>?

    func run() {
        print(_getRetainCount(self))
    }

    func work() {
        task = Task.detached {
            try await longRunningTask { [weak self] in
                self?.run()
            }
        }
    }
}

do {
    let obj = Obj()
    print(_getRetainCount(obj))
    obj.work()
    print(_getRetainCount(obj))
}

try await Task.sleep(for: .milliseconds(1500))
