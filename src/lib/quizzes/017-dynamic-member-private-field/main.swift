@dynamicMemberLookup
struct Wrap {
    var x = 0
    private var y = 7
    subscript(dynamicMember key: String) -> Int { 99 }
}
print(Wrap().y)     // outside the type
