struct Box<T> {}
extension Box where T == Int {
    func tag() -> String {
        "int"
    }
}

extension Box {
    func tag() -> String {
        "any"
    }
}

print(Box<Int>().tag())
print(Box<String>().tag())

func describe<T>(_ b: Box<T>) {
    print(b.tag())
}

describe(Box<Int>())
