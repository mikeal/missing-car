import createCAR from 'datastore-car'
import bent from 'bent'
import Block from '@ipld/block/defaults.js'
import bitcoin from '@ipld/bitcoin'

const get = bent()
const { multiformats } = Block
multiformats.add(bitcoin)

const CAR = createCAR(multiformats)

const run = async url => {
  const stream = await get(url)
  const car = await CAR.readStreaming(stream)
  const query = await car.query()
  const seen = new Set()
  const missing = new Set()
  for await (let { key, value } of car.query()) {
    value = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    const block = Block.create(value, key)
    const cid = await block.cid()
    const cacheKey = cid.toString() // this is deterministic, the string key from the CAR is not (yet)
    seen.add(cacheKey)
    missing.delete(cacheKey)
    for (const link of block.reader().links()) {
      const cacheKey = link.toString()
      console.log(cacheKey)
      if (!seen.has(cacheKey)) missing.add(cacheKey)
    }
  }
  console.log([...missing])
}
run('https://ipld-bitcoin-cars.s3-us-west-2.amazonaws.com/0000000-0155352.car')
