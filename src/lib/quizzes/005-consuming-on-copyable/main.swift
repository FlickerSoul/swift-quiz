struct Point { var x = 0 }
extension Point {
    consuming func bumped() -> Point {
      self.x += 1
      return self
    }
}
let p = Point()
let q = p.bumped()
print(p.x)
print(q.x)
