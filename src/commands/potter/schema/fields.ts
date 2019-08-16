import { SfdxCommand, flags, FlagsConfig } from '@salesforce/command';
import { Constants } from '../../../constants';

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
            required: false,
            default: 'name'
        })
    }
    
    protected static requiresUsername = true;

    public async run(): Promise<any> {
        const apiversion = await this.org.getConnection().retrieveMaxApiVersion();
        
        const response = await this.callDescribe(apiversion, this.flags.sobject);

        this.output(response);
        
        return response
    }

    private callDescribe(apiversion, sobject) {
        return this.org.getConnection().request({
            method: Constants.REST_METHOD_GET,
            headers: Constants.CONTENT_TYPE_APPLICATION_JSON,
            url: Constants.REST_API_ENDPOINT_PREFIX + apiversion + Constants.SOBJECTS_PATH + sobject + Constants.DESCRIBE_PATH
        });
    }
    private output(response) {
        if (response["fields"] && !this.flags.field) {
            this.outputFieldList(this.sort(response));
        }

        if (response["fields"] && this.flags.field) {
            this.outputFieldDetail(response, this.flags.field);
        }
    }

    private sort(response) {
        return response["fields"].sort((a, b) => a[this.flags.sortby].localeCompare(b[this.flags.sortby]));
    }

    private outputFieldList(sorted) {
        let data = [];

        sorted.forEach(field => {
            data.push({
                label: field.label,
                name: field.name,
                relationshipName: field.relationshipName,
                type: field.type,
                length: field.length
            })
        });

        this.ux.table(data, ['label', 'name', 'relationshipName', 'type', 'length']);
    }

    private outputFieldDetail(response, field) {
        response["fields"].forEach(field => {
            if (field["name"].toUpperCase() === this.flags.field.toUpperCase()) {
                this.ux.log(JSON.stringify(field, null, 3));
            }
        })
    }
}