/* eslint-disable no-console */
function pushToOtherApp(params) {
  const paramsCopy = params
  console.log(paramsCopy)
  paramsCopy.app = 14
  console.log(paramsCopy)

  // const params = {
  //   app: 14,
  //   record: {
  //     pd_title: {
  //       value: 'test message',
  //     },
  //   },
  // }
  return kintone.api(kintone.api.url('/k/v1/record', true), 'POST', params)
  // .then(
  //   function gosuccess(resp) {
  //     return resp
  //   },
  //   function goerror(error) {
  //     // console.log(error)
  //   },
  // )`
  // return res
}

kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], async (event) => {
  const thisrecord = event.record
  console.log(event.record.my_subtable.value[0].value.sb_title.value)
  const params = { record: { pd_title: { value: undefined } } }
  params.record.pd_title.value = event.record.my_subtable.value[0].value.sb_title.value
  console.log(params)
  try {
    const feedbackRecord = await pushToOtherApp(params)
    console.log(feedbackRecord)
    thisrecord.my_subtable.value[0].value.sb_callback_rd_no.value = feedbackRecord.id
  } catch (error) {
    console.log(error.message)
  }
  return event
})
