import assert from 'node:assert/strict'
import JSONbig from 'json-bigint'

const raw = '{"code":0,"data":437080090502733824}'
const parsed = JSONbig({ storeAsString: true }).parse(raw)

assert.equal(typeof parsed.data, 'string')
assert.equal(parsed.data, '437080090502733824')
