/* eslint-disable no-console */

function putRecords(app, records) {
  const limit = 100
  return Promise.all(
    records
      .reduce(
        function splitBlock(recordsBlocks, record) {
          if (recordsBlocks[recordsBlocks.length - 1].length === limit) {
            recordsBlocks.push([record])
          } else {
            recordsBlocks[recordsBlocks.length - 1].push(record)
          }
          return recordsBlocks
        },
        [[]],
      )
      .map(function doPut(recordsBlock) {
        return kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', {
          app,
          records: recordsBlock,
        })
      }),
  )
}

function postRecordOneByOne(app, record) {
  return kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
    app,
    record,
  })
}

kintone.events.on(
  [
    'app.record.create.show',
    'app.record.edit.show',
    'app.record.create.change.my_subtable',
    'app.record.edit.change.my_subtable',
  ],
  (event) => {
    const rd = event.record
    rd.my_subtable.value.forEach((element) => {
      const ele = element
      ele.value.sb_callback_rd_no.disabled = true
    })
    return event
  },
)

kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], async (event) => {
  const startTime = new Date().getTime()
  const thisrecord = event.record

  // 筛选更新对象
  const readyToPutRecords = thisrecord.my_subtable.value
    .map((current) => {
      // 有关联的编号说明是更新的对象
      if (current.value.sb_callback_rd_no.value) {
        return {
          id: current.value.sb_callback_rd_no.value,
          record: {
            pd_title: { value: current.value.sb_title.value },
          },
        }
      }
      return null
    })
    .filter((x) => x)
  await putRecords(14, readyToPutRecords)
  const postResponseAll = () => {
    return Promise.all(
      thisrecord.my_subtable.value.map(async (current, index, array) => {
        const ar = array[index]
        if (!current.value.sb_callback_rd_no.value) {
          const postResponse = await postRecordOneByOne(14, {
            pd_title: { value: current.value.sb_title.value },
          })
          ar.value.sb_callback_rd_no.value = postResponse.id
          return postResponse
        }
        return 'not post item'
      }),
    )
  }
  await postResponseAll()
  const endTime = new Date().getTime()
  console.log(endTime - startTime)
  return event
})
