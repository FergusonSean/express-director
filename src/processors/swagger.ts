
import { SwaggerProcessor } from '../types'

const processor = <Controller extends SwaggerProcessor>
({controller}: { controller: Controller}) => 
  ({ handlers: [], swagger: controller.swagger || {}})


export default processor
