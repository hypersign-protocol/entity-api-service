import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseFilters,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SchemaService } from '../services/schema.service';
import { CreateSchemaDto } from '../dto/create-schema.dto';
import { UpdateSchemaDto } from '../dto/update-schema.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '@nestjs/swagger';
import { ApiCreatedResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AllExceptionsFilter } from 'src/utils/utils';
import { Schemas } from '../schema/schemas.schema';
@UseFilters(AllExceptionsFilter)
@ApiTags('Schema')
@Controller('schema')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @ApiBearerAuth('Authorization')
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiCreatedResponse({
    description: 'Schema Created',
    // type: Schemas,
  })
  create(@Body() createSchemaDto: CreateSchemaDto, @Req() req: any) {
    const appDetail = req.user;
    console.log(appDetail);
    return this.schemaService.create(createSchemaDto, appDetail);
  }

  @ApiBearerAuth('Authorization')
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.schemaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schemaService.findOne(+id);
  }
  @ApiResponse({
    description: 'Schema  List',
    //type: schemas,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSchemaDto: UpdateSchemaDto) {
    return this.schemaService.update(+id, updateSchemaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schemaService.remove(+id);
  }
}
