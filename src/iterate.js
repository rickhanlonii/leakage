import LeakageRunner from './LeakageRunner'

let runningLeakTests = 0

/**
 * @param {number} iterationCount
 * @param {Function} iteratorFunc
 */
export default function iterate (iterationCount, iteratorFunc) {
  let error = null
  let onDoneHasRun = false
  let syncHasRun = false
  let onAsyncCompletion = () => {}

  const runner = new LeakageRunner(iterationCount, iteratorFunc, onDone)

  function onDone (iterationError) {
    error = iterationError
    runningLeakTests--
    onDoneHasRun = true
    runner.destruct()
    onAsyncCompletion(iterationError)
  }

  if (runningLeakTests > 0) {
    throw new Error(`Multiple concurrent leak tests running. This will ruin the heap diffs. Make sure the tests are run strictly sequential.`)
  }

  runningLeakTests++
  runner.iterate()

  syncHasRun = true

  if (onDoneHasRun) {
    // Iteration performed synchronously
    if (error) {
      throw error
    }
  } else {
    return new Promise((resolve, reject) => {
      onAsyncCompletion = error => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }
    })
  }
}
