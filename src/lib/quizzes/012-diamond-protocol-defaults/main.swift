protocol P {}
extension P { func f() { print("P") } }

protocol Q: P {}
extension Q { func f() { print("Q") } }

struct S: P, Q {}
S().f()
