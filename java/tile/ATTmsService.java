package com.lzugis.tile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.FileUtils;

import com.lzugis.tile.helper.CommonConfig;
import com.lzugis.tile.helper.TileCloudHelper;
import com.lzugis.tile.model.TileCloud;
import com.lzugis.tile.model.TileLayer;

public class ATTmsService {
	private static ATTmsService instance = null;
	
	private static byte[] blankImg = null;
	
	private static String rootPath = CommonConfig.getVal("tile.path");
	
	private static String base64Blank = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NkZFQUUzNjgyRjJBMTFFNEFBQ0JGMEMyRjFFNUE0MUYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NkZFQUUzNjkyRjJBMTFFNEFBQ0JGMEMyRjFFNUE0MUYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2RkVBRTM2NjJGMkExMUU0QUFDQkYwQzJGMUU1QTQxRiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2RkVBRTM2NzJGMkExMUU0QUFDQkYwQzJGMUU1QTQxRiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pij7ZYAAAAJdSURBVHja7NQxAQAACMMwwL/nYQAHJBJ6tJMU8NNIAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAGAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAYABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAGAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAYABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAJcVYADnygT9CIf4ngAAAABJRU5ErkJggg==";
	
	public static ATTmsService getInstance(){
		if(instance == null){
			instance = new ATTmsService();			
			try {
				rootPath = CommonConfig.getVal("tile.path");
				rootPath += File.separator;
			} 
			catch (Exception e) {
				e.printStackTrace();
			}			
		}
		if(blankImg == null){
			blankImg = Base64.decodeBase64(base64Blank);
		}
		return instance;
	}
	
	public byte[] getTileData(String layername,int z,int y,int x){
		byte[] data = null;
		File file = new File(rootPath + layername + File.separator + z
				+ File.separator + y + "_" + x + ".png");
		//已经缓存
		if(file.exists()){
			try {
				return FileUtils.readFileToByteArray(file);
			} 
			catch (IOException e) {
				e.printStackTrace();
			}
		}
		else{
			data = TileCloudHelper.getInstance().getTileData(layername, x, y, z);
			//如果获得图片，进行缓存
			if(data != null){				
				try {
					FileUtils.writeByteArrayToFile(file, data);
				} 
				catch (IOException e) {
					e.printStackTrace();
				}
			}
			else{
				return blankImg;
			}
		}
		return data;
	}

	public HashMap<String, TileLayer> getTileList() {
		return TileCloud.getTilelayers();
	}
}
