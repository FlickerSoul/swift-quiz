@dynamicMemberLookup
struct Wrap<T> {
    var inner: T
    var y = 0
    subscript<U>(dynamicMember kp: KeyPath<T, U>) -> U {
        inner[keyPath: kp]
    }

    subscript(dynamicMember key: String) -> String {
        "\(key)"
    }
}

struct Inner {
    var x = 1
    var y = 2
}

let w = Wrap(inner: Inner())
print(w.x)
print(w.y)
print(w.z)
