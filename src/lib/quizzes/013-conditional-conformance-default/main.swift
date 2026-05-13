protocol P {}
extension P {
    func value() -> Int {
        1
    }
}

extension P where Self: Equatable {
    func value() -> Int {
        2
    }
}

struct S: P, Equatable {}
struct T: P {}

print(S().value())
print(T().value())
