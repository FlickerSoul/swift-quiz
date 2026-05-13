protocol P { func foo() -> String }
extension P { func foo() -> String {
    "P"
} }

class A: P { func foo() -> String {
    "A"
} }
class B: P {}
class C: B { func foo() -> String {
    "C"
} }

print(A().foo())
print((A() as P).foo())
print(B().foo())
print((B() as P).foo())
print(C().foo())
print((C() as P).foo())
