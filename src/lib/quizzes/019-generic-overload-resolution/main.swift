protocol A {}

protocol B {}

struct Test: A, B {}

func outer(_ val: (some A).Type) {
    allow(val)
}

func allow(_: (some A).Type) {
    print("A only")
}

func allow(_: (some A & B).Type) {
    print("A & B")
}

outer(Test.self)
