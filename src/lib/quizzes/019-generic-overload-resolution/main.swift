protocol A {}

protocol B {}

struct Test: A, B {}

func outer<T: A>(_ val: T.Type) {
    inner(val)
}

func inner<T: A>(_: T.Type) {
    print("A only")
}

func inner<T: A & B>(_: T.Type) {
    print("A & B")
}

outer(Test.self)
