import { ApiProperty } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, Validate, ValidateNested } from 'class-validator';
import { Role } from 'src/utils/Enum/roles.enum';




export class ApiSecretDto {

    @ApiProperty({
        name: 'name',
        example: '',
    })
    name:string;
    @ApiProperty({
        name: 'permissions',
        enum:Role,
        enumName:'Role',
        isArray: true,

        description: `Available Scopes`
    })
    @IsArray()
    @IsEnum(Role, { each: true })
    permissions: Role[]

    @ApiProperty({
        name:'expiry',
        example:'2023-02-15T09:43:29.016Z',


    })
    expiry:string
}




