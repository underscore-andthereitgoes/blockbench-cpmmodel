import { Plugin } from "blockbench-types/generated/plugin_loader";

class IOHelper {

  private pointer: number = 0;
  constructor(public readonly data: Uint8Array<ArrayBuffer>) {}

  tell(): number {
    return this.pointer;
  }

  seek(to: number) {
    this.pointer = to;
  }

  move(by: number): number {
    return this.pointer += by;
  }

  readByte(): number | null {
    return this.data[this.pointer++] ?? null;
  }

  readBytes(n: number): Uint8Array<ArrayBuffer> {
    return this.data.slice(this.pointer, this.pointer += n);
  }

  readVarInt(): number {
    let int = 0;
    let bit = 0;

    let b0: number;
    do {
      b0 = this.readByte() ?? 0;
      int |= (b0 & 127) << (bit * 7);
      bit++;
      if (bit > 5) throw "VarInt too big";
    } while (b0 & 128);

    return int;
  }

  readByteArray(): Uint8Array<ArrayBuffer> {
    let length = this.readVarInt();
    if (length < 0) throw "";
    else return this.readBytes(length);
  }

  readUTF(): string {
    return new TextDecoder().decode(this.readByteArray());
  }

  readNextBlock(): Uint8Array<ArrayBuffer> {
    let blockSize = this.readVarInt();
    if (blockSize >= 0 && blockSize <= 16777216) {
      return this.readBytes(blockSize);
    } else throw "Invalid block size: " + blockSize;
  }

}



class CPMModelFile extends IOHelper {

  fname: string = "";
  name: string = "";
  desc: string = "";
  dataBlock: Uint8Array = new Uint8Array();
  overflow: Uint8Array = new Uint8Array();
  link: string = "";
  iconData: Uint8Array = new Uint8Array();
  load(): this {
    if (this.readByte() != 83) throw "Magic number mismatch";
    this.fname = this.readUTF();
    this.name = this.readUTF();
    this.desc = this.readUTF();
    this.dataBlock = this.readByteArray();
    this.overflow = this.readByteArray();
    if (this.overflow.length > 0) {
      let pathLength = this.readByte();
      if (pathLength === null) throw "bweh";
      this.link = String.fromCharCode(...this.readBytes(pathLength));
    }

    this.iconData = this.readNextBlock();

    this.readByte(); this.readByte(); // don't check sum

    return this;
  }

}

Plugin.register("bbcpmm", {
  title: "CPM Models in Blockbench",
  author: "_andthereitgoes",
  description: "loads cpmmodel files into blockbench projects",
  icon: "bar_chart",
  version: "0.1.0",
  variant: "both",
  onload() {
  },
  onunload() {
  },
});