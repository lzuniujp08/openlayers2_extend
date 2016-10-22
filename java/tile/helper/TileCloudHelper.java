package com.lzugis.tile.helper;

import java.io.File;
import java.io.FileFilter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collection;

import com.lzugis.tile.model.TileCloud;
import com.lzugis.tile.model.TileLayer;
import com.lzugis.tile.model.TileLevel;

public class TileCloudHelper {
	
	private static TileCloudHelper tileCloudHelper = null;
	
	private static TileCloud tileCloud = null;
	
	private static String rootPath = CommonConfig.getVal("tile.path");
	
	public static TileCloudHelper getInstance(){
		if(tileCloudHelper == null){
			tileCloudHelper = new TileCloudHelper();
			try {
				rootPath = CommonConfig.getVal("tile.path");
				rootPath += File.separator;
			} 
			catch (Exception e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
		}
		
		tileCloud = TileCloud.getInstance();
		return tileCloudHelper;
	}
	
	public TileLayer getTileLayer(String layername){
		return tileCloud.getTileLayer(layername);
	}
	
	public void initTileLayerFromXML() throws Exception{
		try{
			Collection<File>  files = listFiles(rootPath);
			for (File xmlFile : files) {
				try {
					TileCloud.getInstance().initTileLayer(xmlFile);
				} 
				catch (Exception e) {
					throw new Exception("切片元数据文件解析错误，路径为："+xmlFile.getAbsolutePath());
				}
			}
		} 
		catch (Exception e) {
			throw new Exception("切片路径配置错误，路径为："+rootPath);
		}
	}
	public Collection<File> listFiles(String path) {
		File file = new File(path);
		Collection<File> result = new ArrayList<File>(); 		
		if (!file.isDirectory()) { 			
			System.out.println("切片路径配置错误，路径为："+path); 			
		} 
		else { 			
			File[] directoryList = file.listFiles(new FileFilter() {
				public boolean accept(File file) { 					
					if (file.isFile() && file.getName().indexOf("xml") > -1) { 
						return true; 					
					} 
					else { 						
						return false; 					
					} 				
				} 			
			}); 			
			for (int i = 0; i < directoryList.length; i++) {
				result.add(new File(directoryList[i].getPath())); 			
			} 		
		} 		
		return result; 	
	}
	
	public void initTileLayerFromXML(File xmlFile) throws Exception{
		try {
			TileCloud.getInstance().initTileLayer(xmlFile);
		} 
		catch (Exception e) {
			throw e;
		}
	}
	
	public void initTileLayerByName(String layerName) throws Exception{
		try {
			String filePath = rootPath+layerName+".xml";
			File xmlFile = new File(filePath);
			TileCloud.getInstance().initTileLayer(xmlFile);
		} 
		catch (Exception e) {
			throw e;
		}
	}
	
	public byte[] getTileData(String layername,int column,int row,int zoom){
		byte[] data = null;		
		Connection tilefileConn = null;
		layername = getTileFilename(layername,column,row,zoom);
		
		try{
			Class.forName("org.sqlite.JDBC");
			
			String tileDBPath = rootPath +layername + ".mbtiles";
			
			File tileDBFile = new File(tileDBPath);
			
			if(tileDBFile.exists()){
				String _url = "jdbc:sqlite:/" + tileDBFile.getAbsolutePath();
				tilefileConn = DriverManager.getConnection(_url);
				
				Statement _stat = tilefileConn.createStatement();
				String sql = "select tile_data from tiles where zoom_level = "+zoom+" and tile_column = "+column+" and tile_row = "+row;
				
				ResultSet _rs = _stat.executeQuery(sql);
				if(_rs.next()){
					data = _rs.getBytes(1);
				}
				else{
					return null;
				}				
				_rs.close();				
				_stat.close();				
				tilefileConn.close();
			}
			else{
				return null;
			}
		} 
		catch (Exception e) {
			return null;
		}
		finally{
			if(tilefileConn != null){
				try {
					tilefileConn.close();
				} 
				catch (SQLException e) {
					e.printStackTrace();
				}
			}
		}
		return data;
	}
	
	private String getTileFilename(String layername,int column,int row,int zoom){
		int totalLen = getTotalLen(layername, column, row, zoom);
		if(totalLen == -1){
			return null;
		}
		int tileMaxCount = getTileLayer(layername).getMaxTileCount();
		int layerindex = totalLen%tileMaxCount;
		return layername+"_"+(layerindex == 0?((totalLen/tileMaxCount)-1):(totalLen/tileMaxCount));
	}
	
	private int getTotalLen(String layername,int column,int row,int zoom){
		//请求级别应该大于等于最小，小于等于最大
		TileLayer tileLayer = getTileLayer(layername);
		
		if(tileLayer == null){
			//如果不存在，尝试再次初始化
			try {
				initTileLayerFromXML(new File(rootPath + File.separator + layername + ".xml"));
			} catch (Exception e) {
				return -1;
			}
			tileLayer = getTileLayer(layername);
		}
		
		if(tileLayer == null){
			return -1;
		}
		if(zoom < tileLayer.getMinZoom() || zoom > tileLayer.getMaxZoom()){
			return -1;
		}
		int zoomLen = getZoomLen(tileLayer,zoom);
		int rowColumnLen = getRowColumnLen(tileLayer,column, zoom);
		int rowLen = getRowLen(tileLayer,row, zoom);
		return zoomLen + rowColumnLen + rowLen;
	}
	
	private int getZoomLen(TileLayer tileLayer,int zoom){
		int zoomLen = 0;
		int minZoom = tileLayer.getMinZoom();
		for (int i = minZoom; i < zoom; i++) {
			TileLevel tileLevel = tileLayer.getTileLevel(i);
			zoomLen += tileLevel.getTileCount();
		}
		return zoomLen;
	}
	
	private int getRowColumnLen(TileLayer tileLayer,int column,int zoom){
		TileLevel tileLevel = tileLayer.getTileLevel(zoom);
		int columnCount = column - tileLevel.getMincolumn();
		int totalRow = tileLevel.getMaxrow() - tileLevel.getMinrow() + 1;
		return (columnCount * totalRow);
	}
	
	private int getRowLen(TileLayer tileLayer,int row,int zoom){
		TileLevel tileLevel = tileLayer.getTileLevel(zoom);
		int rowLen = row - tileLevel.getMinrow()+1;
		return rowLen;
	}
}
