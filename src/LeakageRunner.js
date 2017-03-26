import memwatch from 'memwatch-next'
import IterationBlock from './IterationBlock'
import getSubsequentHeapGrowths from './getSubsequentHeapGrowths'
import createLeakErrorFactory from './leakErrorFactory'
import saveHeapDiffs from './saveHeapDiffs'

export default class LeakageRunner {
  constructor (iterationCount, iteratorFunc, onDoneFunc) {
    this.garbageCollections = 6
    this.throwOnSubsequentHeapGrows = 4
    this.heapDiffs = []

    this.iteratorFunc = iteratorFunc
    this.iterationCount = iterationCount > this.garbageCollections
      ? iterationCount
      : this.garbageCollections

    this.iterationBlocks = createIterationBlocks(this.iterationCount, this.garbageCollections, iteratorFunc)
    this.iterationBlockDone = this.iterationBlockDone.bind(this)
    this.iterationBlocksDone = 0
    this.iteratorIsAsync = false
    this.onDoneFunc = onDoneFunc
  }

  destruct () {
    // Make sure we clean up our stuff

    this.heapDiffs = null
    this.iteratorFunc = null
    this.onDoneFunc = null

    for (const iterationBlock of this.iterationBlocks) {
      iterationBlock.destruct()
    }

    memwatch.gc()
  }

  iterate () {
    this.error = null
    memwatch.gc()
    this.startNextIterationBlock()
  }

  startNextIterationBlock () {
    if (this.iterationBlocksDone >= this.iterationBlocks.length) {
      return this.allIterationBlocksDone()
    }

    this.currentHeapDiff = new memwatch.HeapDiff()

    // this.iterationBlockDone has already been bound
    this.iterationBlocks[ this.iterationBlocksDone++ ].iterate(this.iterationBlockDone)
  }

  iterationBlockDone (error, iteratorIsAsync) {
    memwatch.gc()
    this.heapDiffs.push(this.currentHeapDiff.end())
    this.iteratorIsAsync = iteratorIsAsync

    if (error) {
      this.error = error
      this.allIterationBlocksDone()
    } else {
      this.startNextIterationBlock()
    }
  }

  allIterationBlocksDone () {
    if (!this.error) {
      this.allIterationBlocksSuccess()
    }
    this.onDoneFunc(this.error)
  }

  allIterationBlocksSuccess () {
    saveHeapDiffs(this.heapDiffs, this.throwOnSubsequentHeapGrows)

    const subsequentHeapGrowths = getSubsequentHeapGrowths(this.heapDiffs)

    if (subsequentHeapGrowths.length >= this.throwOnSubsequentHeapGrows) {
      const newHeapError = createLeakErrorFactory(this.iterationCount, this.iterationBlocks.length)
      this.error = newHeapError(subsequentHeapGrowths)
    }
  }
}

/**
 * Split complete iteration into multiple chunks.
 */
function createIterationBlocks (totalIterations, blocksToCreate, iteratorFunc) {
  const blocks = []

  for (let index = 0; index < blocksToCreate; index++) {
    const iterations = Math.round((index + 1) / blocksToCreate * totalIterations) - Math.round(index / blocksToCreate * totalIterations)
    blocks.push(new IterationBlock(iterations, iteratorFunc))
  }

  return blocks
}
