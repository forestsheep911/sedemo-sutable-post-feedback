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

function postRecords(app, records) {
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
        return kintone.api(kintone.api.url('/k/v1/records', true), 'POST', {
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

kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], async (event) => {
  const thisrecord = event.record
  console.log(event.record.my_subtable.value[0].value.sb_title.value)
  const params = { pd_title: { value: undefined } }
  params.pd_title.value = event.record.my_subtable.value[0].value.sb_title.value
  console.log(params)
  // try {
  const feedbackRecord = await postRecordOneByOne(14, params)
  console.log(feedbackRecord)
  thisrecord.my_subtable.value[0].value.sb_callback_rd_no.value = feedbackRecord.id
  // } catch (error) {
  //   console.log(error.message)
  // }
  // 组建一个需要创建或更新记录的数组
  // const todoRecords = thisrecord.my_subtable.value.reduce(
  //   (accumulator, current) => {
  //     // 有关联的编号说明是更新的对象
  //     if (current.value.sb_callback_rd_no.value) {
  //       accumulator.update.push({
  //         id: current.value.sb_callback_rd_no.value,
  //         record: {
  //           pd_title: { value: current.value.sb_title.value },
  //         },
  //       })
  //     } else {
  //       accumulator.create.push({
  //         pd_title: { value: current.value.sb_title.value },
  //       })
  //     }
  //     return accumulator
  //   },
  //   { update: [], create: [] },
  // )
  // console.log(todoRecords)

  // const readyToPutRecords = thisrecord.my_subtable.value.map((current) => {
  //   // 有关联的编号说明是更新的对象
  //   if (current.value.sb_callback_rd_no.value) {
  //     return {
  //       id: current.value.sb_callback_rd_no.value,
  //       record: {
  //         pd_title: { value: current.value.sb_title.value },
  //       },
  //     }
  //   }
  //   return []
  // })
  // console.log(readyToPutRecords)

  // const params = {
  //   id: thisrecord.my_subtable.value[0].value.sb_callback_rd_no.value,
  //   record: {
  //     pd_title: { value: thisrecord.my_subtable.value[0].value.sb_title.value },
  //   },
  // }
  // console.log([params])
  // const readyToPostRecords =

  // const createResponse = await postRecords(14, todoRecords.create)
  // console.log(createResponse)
  const postResponseAll = () => {
    return Promise.all(
      thisrecord.my_subtable.value.map(async (current, index, array) => {
        const ar = array[index]
        if (!current.value.sb_callback_rd_no.value) {
          const postResponse = await postRecordOneByOne(14, {
            pd_title: { value: current.value.sb_title.value },
          })
          console.log(postResponse)
          console.log(current)
          console.log(array)
          console.log(array[index])
          ar.value.sb_callback_rd_no.value = postResponse.id
          return postResponse
        }
        return 'not post item'
      }),
    )
  }
  await postResponseAll()
  return event
})
