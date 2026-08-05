class IOHelper {
    data;
    pointer = 0;
    constructor(data) {
        this.data = data;
    }
    tell() {
        return this.pointer;
    }
    seek(to) {
        this.pointer = to;
    }
    move(by) {
        return this.pointer += by;
    }
    readByte() {
        return this.data[this.pointer++] ?? null;
    }
    readBytes(n) {
        return this.data.slice(this.pointer, this.pointer += n);
    }
    readVarInt() {
        let int = 0;
        let bit = 0;
        let b0;
        do {
            b0 = this.readByte() ?? 0;
            int |= (b0 & 127) << (bit * 7);
            bit++;
            if (bit > 5)
                throw "VarInt too big";
        } while (b0 & 128);
        return int;
    }
    readByteArray() {
        let length = this.readVarInt();
        if (length < 0)
            throw "";
        else
            return this.readBytes(length);
    }
    readUTF() {
        return new TextDecoder().decode(this.readByteArray());
    }
    readNextBlock() {
        let blockSize = this.readVarInt();
        if (blockSize >= 0 && blockSize <= 16777216) {
            return this.readBytes(blockSize);
        }
        else
            throw "Invalid block size: " + blockSize;
    }
}
class CPMModelFile extends IOHelper {
    fname = "";
    name = "";
    desc = "";
    dataBlock = new Uint8Array();
    overflow = new Uint8Array();
    link = "";
    iconData = new Uint8Array();
    load() {
        if (this.readByte() != 83)
            throw "Magic number mismatch";
        this.fname = this.readUTF();
        this.name = this.readUTF();
        this.desc = this.readUTF();
        this.dataBlock = this.readByteArray();
        this.overflow = this.readByteArray();
        if (this.overflow.length > 0) {
            let pathLength = this.readByte();
            if (pathLength === null)
                throw "bweh";
            this.link = String.fromCharCode(...this.readBytes(pathLength));
        }
        this.iconData = this.readNextBlock();
        this.readByte();
        this.readByte(); // don't check sum
        return this;
    }
}
BBPlugin.register("bbcpmm", {
    title: "CPM Models in Blockbench",
    author: "underscore",
    description: "loads cpmmodel files into blockbench projects",
    icon: "bar_chart",
    version: "0.1.0",
    variant: "both",
    onload() {
    },
    onunload() {
    },
});
export {};
