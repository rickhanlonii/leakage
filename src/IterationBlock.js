export default class IterationBlock {
  constructor (iterationsToDo, iteratorFunc, onDoneFunc = null) {
    this.iterationsDone = 0
    this.iterationsToDo = iterationsToDo
    this.iteratorFunc = iteratorFunc
    this.onDoneFunc = onDoneFunc
    this.iterationSuccess = this.iterationSuccess.bind(this)
    this.iterationFailure = this.iterationFailure.bind(this)
  }

  destruct () {
    this.iteratorFunc = null
    this.onDoneFunc = null
  }

  iterate (onDoneFunc) {
    this.error = null
    this.iteratorIsAsync = false
    this.onDoneFunc = onDoneFunc

    for (this.iterationsStarted = 0; this.iterationsStarted < this.iterationsToDo; this.iterationsStarted++) {
      try {
        const result = this.iteratorFunc()

        if (result && typeof result.then === 'function') {
          // async, this.iterationSuccess, this.iterationFailure have already been bound
          result.then(this.iterationSuccess, this.iterationFailure)
        } else {
          // sync
          this.iterationSuccess()
        }
      } catch (error) {
        this.iterationFailure(error)
      }
    }
  }

  iterationSuccess () {
    this.iterationDone()
  }

  iterationFailure (error) {
    this.error = error
    this.iterationDone()
  }

  iterationDone () {
    this.iterationsDone++
    if (this.iterationsDone === this.iterationsToDo) {
      this.onDoneFunc(this.error, this.iteratorIsAsync)
    }
  }
}
