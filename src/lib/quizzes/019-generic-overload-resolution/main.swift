protocol A {}

protocol B {}

struct Test: A, B {}


func outer<T: A>(_ val: T.Type) {
  allow(val)
}

func allow<T: A>(_: T.Type) {
  print("A only")
}

func allow<T: A & B>(_: T.Type) {
  print("A & B")
}

outer(Test.self)
