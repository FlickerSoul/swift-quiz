struct H: ~Copyable {
  consuming func finalize() {
    print("saved"); discard self
  }
  deinit {
    print("deinit")
  }
}
H().finalize()
