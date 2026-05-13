func resumeLater(cont: CheckedContinuation<Int, Never>) {
  Task {
    try await Task.sleep(for: .seconds(1))
    cont.resume(returning: 1)
  }
}

let task = Task {
  async let a: Int = {
    let val = await withCheckedContinuation { cont in
      resumeLater(cont: cont)
    }
    print("resumed")
    return val
  }()

  print("after let")
}

task.cancel()
_ = await task.result

print("finished")
