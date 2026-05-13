extension Equatable {
    func same(as other: Self) -> Bool {
        self == other
    }
}

let a: any Equatable = 1
let b: any Equatable = 1

print(a.same(as: b))
