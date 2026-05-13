struct File: ~Copyable {
    deinit {
        print("deinit")
    }

    borrowing func write(_: [UInt8]) {}
    consuming func close() {}
}

let condition = false

do {
    let file = File()
    file.write([1, 2, 3])

    if condition {
        file.close()
    } else {
        print("not closed")
    }

    if !condition {
        file.write([1])
        file.close()
    }

    print("done writing")
}
