func swaps(_ a: inout Int, _ b: inout Int) {
    let temp = a
    a = b
    b = temp
}

var t = (1, 2)
swaps(&t.0, &t.1)

print(t.0)
print(t.1)
