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

func describe(_ b: Box<some Any>) {
    print(b.tag())
}

describe(Box<Int>())
