import { test_dest } from 'segment-sloth'
import { dest_payload } from './payload'

const settings: FunctionSettings = {
}

test_dest(dest_payload, settings, <sam_port>).then(() => {
}).catch(e =>{
  console.error(e)
})