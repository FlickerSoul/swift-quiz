class A {}
class B: A {}
var f: (A) -> B = { _ in B() }
var g: (B) -> A = f
print(type(of: g(B())))
