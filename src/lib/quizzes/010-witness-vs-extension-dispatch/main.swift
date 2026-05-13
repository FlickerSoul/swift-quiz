protocol P { func f() }
protocol Q {}
extension P { func f() {
    print("1")
} }
extension Q { func g() {
    print("1")
} }

struct S: P, Q {
    func f() {
        print("2")
    }

    func g() {
        print("2")
    }
}

let s = S()
let p: P = s
let q: Q = s

s.f()
p.f()
s.g()
q.g()
