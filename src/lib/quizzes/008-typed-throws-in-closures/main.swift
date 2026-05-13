enum E: Error {
    case bad
}

func b() throws(E) -> Int {
    throw E.bad
}

func requirement(_: Result<Int, E>) {}

let r = Result { try b() }
requirement(r)
