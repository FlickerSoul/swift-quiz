protocol P {
    func f()
}
extension P { func f() { print("ext-P") } }

protocol Q: P {
    func f()
}
extension Q { func f() { print("ext-Q") } }

struct S: Q {}
S().f()
(S() as P).f()
(S() as Q).f()
