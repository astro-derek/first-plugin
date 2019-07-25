import { join, dirname } from 'path';
import { SfdxCommand, core, flags, FlagsConfig } from '@salesforce/command';
import { request } from 'http';

export default class Fields extends SfdxCommand {
    public static description = 'List field information for an object - useful to quickly view the field names in readable format';

    public static examples = [
        `$ sfdx potter:schema:fields --sobject Account`
    ];

    protected static flagsConfig: FlagsConfig = {
        help: flags.help({ char: 'h' }),
        sobject : flags.string({
            char: 'n',
            description: 'sobject name to list fields for',
            required: true
        }),
        field : flags.string({
            char: 'f',
            description: 'field name to list specific field details',
            required: false
        }),
        sortby : flags.string({
            char: 's',
            description: 'sortby label or api. Defaults to api.',
            required: false
        })
    }

    protected static requiresUsername = true;

    public async run(): Promise<any> {
        const apiversion = await this.org.getConnection().retrieveMaxApiVersion();
        const objectName: string = this.flags.sobject;
        const fieldName: string = this.flags.field;
        const sortBy: string = this.flags.sortby ? this.flags.sortby : 'name';

        this.ux.log("/services/data/v" + apiversion + "/sobjects/" + objectName + "/describe/");

        let response = await this.org.getConnection().request({
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            url: "/services/data/v" + apiversion + "/sobjects/" + objectName + "/describe/"
        });

        const labelHeader: string = 'Label'.padEnd(50);
        const nameHeader: string = 'Name'.padEnd(50);
        const typeHeader: string = 'Type'.padEnd(25);
        const lengthHeader: string = 'Length'.padEnd(50);

        if (response["fields"] && !fieldName) {
            this.ux.log(`Field details for ${objectName}. ${response['fields'].length} fields sorted by ${sortBy}`);
            this.ux.log(`${labelHeader} ${nameHeader} ${typeHeader} ${lengthHeader}`);

            let sorted = response["fields"].sort((a, b) => a[sortBy].localeCompare(b[sortBy]));

            sorted.forEach(field => {
                const labelValue: string = field.label.padEnd(50);
                const nameValue: string = field.name.padEnd(50);
                const typeValue: string = field.type.padEnd(25);
                
                this.ux.log(`${labelValue} ${nameValue} ${typeValue} ${field.length}`);
            });
        }

        if (response["fields"] && fieldName) {
            response["fields"].forEach(field => {
                if (field["name"].toUpperCase() === fieldName.toUpperCase()) {
                    this.ux.log(JSON.stringify(field, null, 3));
                }
            })
        }
        
        return response;

    }
}